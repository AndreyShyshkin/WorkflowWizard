import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, update } from "firebase/database";
import CreateProject from "../../components/CreateProject";
import InviteOnTeam from "../../components/InviteOnTeam";

function Team() {
  const [user, setUser] = useState(null);
  const [teamStatus, setTeamStatus] = useState({ exists: null, member: null });
  const [teamUsers, setTeamUsers] = useState([]); // Список пользователей команды
  const [userProjects, setUserProjects] = useState([]);
  const [userRole, setUserRole] = useState(null); // Роль пользователя
  const auth = getAuth();
  const database = getDatabase();
  const urlParams = new URLSearchParams(window.location.search);
  const teamName = urlParams.get("name");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        checkTeamStatus(currentUser.uid);
        updateWorkStatus(currentUser.uid);
        fetchUserProjects();
      } else {
        setUser(null);
        navigate("/auth");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auth, navigate]);

  const fetchUserProjects = async () => {
    try {
      const projectsRef = ref(database, `teams/${teamName}/projects`);
      const snapshot = await get(projectsRef);
      if (snapshot.exists()) {
        const projects = Object.keys(snapshot.val() || {});
        setUserProjects(projects);
      } else {
        setUserProjects([]); // Если проектов нет, очищаем массив
      }
    } catch (error) {
      console.error("Error fetching user projects:", error.code, error.message);
    }
  };

  const updateWorkStatus = async (userId) => {
    try {
      await update(ref(database, `teams/${teamName}/users/${userId}`), {
        work: true,
      });

      const teamsRef = ref(database, "teams");
      const snapshot = await get(teamsRef);

      if (snapshot.exists()) {
        const teams = snapshot.val();
        const updates = {};

        Object.keys(teams).forEach((team) => {
          if (
            teams[team].users &&
            teams[team].users[userId] &&
            teamName !== team
          ) {
            updates[`teams/${team}/users/${userId}/work`] = false;
          }
        });

        await update(ref(database), updates);
      }
    } catch (error) {
      console.error("Error updating work status:", error);
    }
  };

  const checkTeamStatus = async (userId) => {
    if (!teamName) {
      setTeamStatus({ exists: false, member: false });
      return;
    }

    const teamRef = ref(database, `teams/${teamName}`);
    try {
      const snapshot = await get(teamRef);
      if (snapshot.exists()) {
        const teamData = snapshot.val();
        const isMember = teamData.users && teamData.users[userId];
        setTeamStatus({ exists: true, member: Boolean(isMember) });

        if (isMember) {
          setUserRole(teamData.users[userId]?.role || "view"); // Получение роли пользователя
          loadTeamUsers(); // Загружаем список пользователей
        }
      } else {
        setTeamStatus({ exists: false, member: false });
      }
    } catch (error) {
      console.error("Error checking team status:", error);
      setTeamStatus({ exists: null, member: null });
    }
  };

  const loadTeamUsers = async () => {
    try {
      const teamRef = ref(database, `teams/${teamName}/users`);
      const snapshot = await get(teamRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersArray = Object.entries(usersData).map(([uid, data]) => ({
          uid,
          ...data,
        }));
        setTeamUsers(usersArray); // Обновляем состояние
      }
    } catch (error) {
      console.error("Error loading team users:", error);
    }
  };

  const handleChangeTeam = async () => {
    if (!user) return;

    try {
      const teamsRef = ref(database, "teams");
      const snapshot = await get(teamsRef);

      if (snapshot.exists()) {
        const teams = snapshot.val();
        const updates = {};

        Object.keys(teams).forEach((team) => {
          if (teams[team].users && teams[team].users[user.uid]) {
            updates[`teams/${team}/users/${user.uid}/work`] = false;
          }
        });

        await update(ref(database), updates);
        fetchUserProjects();
        navigate("/createTeam");
      }
    } catch (error) {
      console.error("Error changing team:", error);
    }
  };

  const handleLogoutTeam = async () => {
    const confirmLogout = window.confirm(
      "Вы уверены, что хотите выйти из команды?",
    );
    if (!confirmLogout) return; // Если пользователь нажал "Отмена", выходим из функции

    try {
      const teamUsersRef = ref(database, `teams/${teamName}/users`);

      const snapshot = await get(teamUsersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();

        delete users[user.uid];

        const remainingUsers = Object.keys(users);

        if (remainingUsers.length === 0) {
          await update(ref(database, `teams`), {
            [teamName]: null,
          });
        } else {
          await update(teamUsersRef, {
            [user.uid]: null,
          });
        }

        navigate("/createTeam");
      } else {
        console.error("Ошибка: команда не найдена.");
      }
    } catch (error) {
      console.error("Ошибка при выходе из команды:", error);
    }
  };
  return (
    <div>
      {user ? (
        teamStatus.exists === null ? (
          <span>Loading...</span>
        ) : teamStatus.exists === false ? (
          <span>Команда не существует</span>
        ) : teamStatus.member === false ? (
          <span>Вы не состоите в этой команде</span>
        ) : (
          <div>
            <span>
              {user.displayName} Добро пожаловать в команду {teamName}
            </span>
            <button onClick={handleChangeTeam}>Сменить команду</button>
            <button onClick={handleLogoutTeam}>Выход</button>
            {userProjects.length > 0 ? (
              <div>
                <h3>Team Projects</h3>
                <ul>
                  {userProjects.map((project) => (
                    <li key={project}>
                      <span>{project}</span>
                      <Link
                        to={`/team/project?teamname=${teamName}&projectname=${project}`}
                        style={{ marginLeft: "10px" }}
                      >
                        Go to project
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <h3>The team does not have any projects yet.</h3>
            )}

            {["admin", "edit"].includes(userRole) && <CreateProject />}
            {userRole === "admin" && <InviteOnTeam />}

            <h3>Состав команды:</h3>
            <ul>
              {teamUsers.map((teamUser) => (
                <li key={teamUser.uid}>
                  {teamUser.username}
                  {teamUser.uid === user.uid && <spab>(ВЫ)</spab>}
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <span>Переадресация...</span>
      )}
    </div>
  );
}

export default Team;
