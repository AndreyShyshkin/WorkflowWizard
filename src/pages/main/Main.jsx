import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, update } from "firebase/database";

function Main() {
  const [user, setUser] = useState(null);
  const [teamStatus, setTeamStatus] = useState({ exists: null, member: null });
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
        updateWorkStatus(currentUser.uid); // Обновляем статус работы
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
      // Обновляем work: true для пользователя
      await update(ref(database, `teams/${teamName}/users/${userId}`), {
        work: true,
      });

      // Сбрасываем work: false для всех других команд пользователя
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

        // Применяем обновления
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
      } else {
        setTeamStatus({ exists: false, member: false });
      }
    } catch (error) {
      console.error("Error checking team status:", error);
      setTeamStatus({ exists: null, member: null });
    }
  };

  const handleChangeTeam = async () => {
    if (!user) return;

    try {
      // Сбрасываем work: false для всех команд пользователя
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

        // Применяем обновления
        await update(ref(database), updates);

        // Перенаправляем пользователя на страницу создания команды
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
              {" "}
              {user.displayName} Добро пожаловать в команду {teamName}
            </span>
            <button onClick={handleChangeTeam}>Сменить команду</button>
          </div>
        )
      ) : (
        <span>Переадресация...</span>
      )}
    </div>
  );
}

export default Main;
