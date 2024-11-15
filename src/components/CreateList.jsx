import { getDatabase, ref, set, get, onValue } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function CreateList() {
  const [user, setUser] = useState(null);
  const [listName, setListName] = useState("");
  const [userLists, setUserLists] = useState([]);
  const navigate = useNavigate();
  const auth = getAuth();
  const database = getDatabase();
  const urlParams = new URLSearchParams(window.location.search);
  const teamName = urlParams.get("teamname");
  const projectName = urlParams.get("projectname");

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserLists(currentUser.uid); // Устанавливаем слушатель
      } else {
        navigate("/login");
      }
    });
    // Очищаем слушатель при размонтировании
    return () => {
      const listsRef = ref(
        database,
        `teams/${teamName}/projects/${projectName}/lists/`,
      );
      onValue(listsRef, () => {}); // Останавливаем подписку
    };
  }, [auth, navigate]);

  const fetchUserLists = () => {
    const listsRef = ref(
      database,
      `teams/${teamName}/projects/${projectName}/lists/`,
    );

    onValue(
      listsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setUserLists(Object.keys(snapshot.val() || {}));
        } else {
          setUserLists([]);
        }
      },
      (error) => {
        console.error(
          "Error fetching user projects:",
          error.code,
          error.message,
        );
      },
    );
  };

  const handleCreateList = async () => {
    const trimmedName = listName.trim();

    if (trimmedName === "") {
      console.log("List name cannot be empty");
      return;
    }

    const forbiddenChars = /[^a-zA-Z0-9_]/;
    if (forbiddenChars.test(trimmedName)) {
      console.log("List name contains invalid characters");
      return;
    }

    const listRef = ref(
      database,
      "teams/" + teamName + "/projects/" + projectName + "/" + trimmedName,
    );
    try {
      const snapshot = await get(listRef);
      if (snapshot.exists()) {
        console.log("List name already exists");
        return;
      }
      await set(
        ref(
          database,
          "teams/" +
            teamName +
            "/projects/" +
            projectName +
            "/lists/" +
            trimmedName,
        ),
        {
          status: "active",
        },
      );
      setListName("");
    } catch (error) {
      console.error("Error creating team:", error.code, error.message);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter lists name"
        value={listName}
        onChange={(e) => setListName(e.target.value)}
      />
      <button type="submit" onClick={handleCreateList}>
        Create List
      </button>
      {userLists.length > 0 ? (
        <div>
          <h3>Team Project List</h3>
          <ul>
            {userLists.map((list) => (
              <li key={list}>
                <span>{list}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <h3>In project not have lists</h3>
      )}
    </div>
  );
}

export default CreateList;
