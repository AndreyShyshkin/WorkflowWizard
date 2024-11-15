import { getDatabase, ref, set, get, child } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function CreateTeam() {
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [userTeams, setUserTeams] = useState([]);
  const navigate = useNavigate();
  const auth = getAuth();
  const database = getDatabase();

  const sendWelcomeEmail = async (email) => {
    try {
      const response = await fetch("/.netlify/functions/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          subject: "Welcome to the Team!",
          message: "Thank you for registering with us.",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Email sent successfully:", data.message);
      } else {
        console.error("Error sending email:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserTeams(currentUser.uid); // Fetch teams on auth change
      } else {
        navigate("/login");
      }
    });
  }, [auth, navigate]);

  const fetchUserTeams = async (userId) => {
    const teamsRef = ref(database, "teams");
    try {
      const snapshot = await get(teamsRef);
      if (snapshot.exists()) {
        const teams = snapshot.val();
        const userTeamsList = [];
        let redirected = false;

        Object.keys(teams).forEach((teamName) => {
          if (teams[teamName].users && teams[teamName].users[userId]) {
            userTeamsList.push(teamName);
            if (teams[teamName].users[userId].work === true && !redirected) {
              navigate(`/team?name=${teamName}`);
              redirected = true; // Переадресуем только один раз
            }
          }
        });

        setUserTeams(userTeamsList); // Update user teams
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleCreateTeam = async () => {
    const trimmedName = teamName.trim();

    if (trimmedName === "") {
      console.log("Team name cannot be empty");
      return;
    }

    const forbiddenChars = /[^a-zA-Z0-9_]/;
    if (forbiddenChars.test(trimmedName)) {
      console.log("Team name contains invalid characters");
      return;
    }

    const teamRef = ref(database, "teams/" + trimmedName);
    try {
      const snapshot = await get(teamRef);
      if (snapshot.exists()) {
        console.log("Team name already exists");
        return;
      }
      await set(ref(database, "teams/" + trimmedName + "/users/" + user.uid), {
        username: user.displayName,
        role: "admin",
      });
      //sendWelcomeEmail("shyshkinandrey06@gmail.com");
      navigate("/team?name=" + trimmedName);
    } catch (error) {
      console.error("Error creating team:", error.code, error.message);
    }
  };

  return (
    <div>
      {userTeams.length > 0 ? (
        <div>
          <h3>Your Teams</h3>
          <ul>
            {userTeams.map((team) => (
              <li key={team}>
                <span>{team}</span>
                <Link to={`/team?name=${team}`}>Go to team</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <h3>You have no teams</h3>
      )}
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
