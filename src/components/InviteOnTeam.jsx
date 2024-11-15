import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

function InviteOnTeam() {
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const teamName = urlParams.get("name");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auth]);

  function generateRandomString(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  const randomString = generateRandomString(24);

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

  //sendWelcomeEmail("shyshkinandrey06@gmail.com");
  return (
    <div className="invite-on-team">
      <input placeholder="Email" />
      <div>access</div>
      <button>Пригласить в команду</button>
    </div>
  );
}

export default InviteOnTeam;
