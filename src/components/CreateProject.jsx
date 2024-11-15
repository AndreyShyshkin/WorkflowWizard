import { getDatabase, ref, set, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function CreateProject() {
  const [user, setUser] = useState(null);
  const [projectName, setProjectName] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();
  const database = getDatabase();
  const urlParams = new URLSearchParams(window.location.search);
  const teamName = urlParams.get("name");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const handleCreateProject = async () => {
    const trimmedName = projectName.trim();

    if (trimmedName === "") {
      console.log("Project name cannot be empty");
      return;
    }

    const forbiddenChars = /[^a-zA-Z0-9_]/;
    if (forbiddenChars.test(trimmedName)) {
      console.log("Project name contains invalid characters");
      return;
    }

    const projectRef = ref(
      database,
      `teams/${teamName}/projects/${trimmedName}`,
    );
    try {
      const snapshot = await get(projectRef);
      if (snapshot.exists()) {
        console.log("Project name already exists");
        return;
      }
      // Создаем проект и добавляем текущего пользователя как участника
      await set(
        ref(
          database,
          `teams/${teamName}/projects/${trimmedName}/users/${user.uid}`,
        ),
        {
          userName: user.displayName,
        },
      );
      // Обновляем список проектов после создания
      navigate(`/team/project?teamname=${teamName}&projectname=${trimmedName}`);
    } catch (error) {
      console.error("Error creating project:", error.code, error.message);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter project name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
      />
      <button type="submit" onClick={handleCreateProject}>
        Create Project
      </button>
    </div>
  );
}

export default CreateProject;
