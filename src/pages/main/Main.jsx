import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import CreateTeam from "../../components/CreateTeam";

function Main() {
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        navigate("/auth"); // Перенаправление при отсутствии пользователя
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auth, navigate]);

  return (
    <div>
      {user ? (
        <div>
          <span>Вы вошли в систему как {user.displayName}</span>
          <CreateTeam />
        </div>
      ) : (
        <span>Переадресация...</span> // Можно добавить заглушку
      )}
    </div>
  );
}

export default Main;
