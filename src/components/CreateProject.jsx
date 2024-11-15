import { getDatabase, ref, set, get, child } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function CreateProject() {
  const [user, setUser] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  const navigate = useNavigate();
  const auth = getAuth();
  const database = getDatabase();
  const urlParams = new URLSearchParams(window.location.search);
  const teamName = urlParams.get("name");

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserProjects(currentUser.uid);
      } else {
        navigate("/login");
      }
    });
  }, [auth, navigate]);

  const fetchUserProjects = async () => {
    try {
      const projectsRef = ref(database, `teams/${teamName}/projects`);
      const snapshot = await get(projectsRef);
      if (snapshot.exists()) {
        setUserProjects(Object.keys(snapshot.val() || {}));
      }
    } catch (error) {
      console.error("Error fetching user projects:", error.code, error.message);
    }
  };

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

    const teamRef = ref(database, "teams/" + trimmedName);
    try {
      const snapshot = await get(teamRef);
      if (snapshot.exists()) {
        console.log("Team name already exists");
        return;
      }
      await set(
        ref(
          database,
          "teams/" + teamName + "/projects/" + trimmedName + "/users/",
        ),
        {
          userid: user.uid,
        },
      );
      navigate(
        "/team/project?teamname=" + teamName + "&projectname=" + trimmedName,
      );
    } catch (error) {
      console.error("Error creating team:", error.code, error.message);
    }
  };

  return (
    <div>
      {userProjects.length > 0 ? (
        <div>
          <h3>Team Project</h3>
          <ul>
            {userProjects.map((project) => (
              <li key={project}>
                <span>{project}</span>
                <Link
                  to={`/team/project?teamname=${teamName}&projectname=${project}`}
                >
                  Go to project
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <h3>Team not have project</h3>
      )}
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
