import { getDatabase, ref, set, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateTeam() {
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();
  const database = getDatabase();

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });
  }, [auth, navigate]);

  const handleCreateTeam = async () => {
    const trimmedName = teamName.trim();

    // Check for empty name
    if (trimmedName === "") {
      console.log("Team name cannot be empty");
      return;
    }

    // Check for forbidden characters (only allowing alphanumeric and underscore for example)
    const forbiddenChars = /[^a-zA-Z0-9_]/;
    if (forbiddenChars.test(trimmedName)) {
      console.log("Team name contains invalid characters");
      return;
    }

    // Check if team name already exists
    const teamRef = ref(database, "teams/" + trimmedName);
    try {
      const snapshot = await get(teamRef);
      if (snapshot.exists()) {
        console.log("Team name already exists");
        return;
      }

      // Create the team
      await set(ref(database, "teams/" + trimmedName + "/users/" + user.uid), {
        username: user.displayName,
      });
      navigate("/teams/" + trimmedName);
    } catch (error) {
      console.error("Error creating team:", error.code, error.message);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter team name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
      />
      <button type="submit" onClick={handleCreateTeam}>
        Create Team
      </button>
    </div>
  );
}

export default CreateTeam;
