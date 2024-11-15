import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, update } from "firebase/database";
import CreateProject from "../../components/CreateProject";
import InviteOnTeam from "../../components/InviteOnTeam";

function Team() {
  const [user, setUser] = useState(null);
  const [teamStatus, setTeamStatus] = useState({ exists: null, member: null });
  const [teamUsers, setTeamUsers] = useState([]); // Список пользователей команды
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
      } else {
        setUser(null);
        navigate("/auth");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auth, navigate]);

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
        navigate("/createTeam");
      }
    } catch (error) {
      console.error("Error changing team:", error);
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
            <CreateProject />
            <InviteOnTeam />
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
