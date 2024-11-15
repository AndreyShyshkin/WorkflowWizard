import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, onValue, set } from "firebase/database";

function InviteOnTeam() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("view");
  const [access, setAccess] = useState([]);
  const [projects, setProjects] = useState([]);

  const auth = getAuth();
  const database = getDatabase();
  const urlParams = new URLSearchParams(window.location.search);
  const teamName = urlParams.get("name");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null);
    });

    return () => unsubscribe();
  }, [auth]);

  // Загрузка проектов и списков
  useEffect(() => {
    if (!teamName) return;

    const projectsRef = ref(database, `/teams/${teamName}/projects`);
    onValue(projectsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedProjects = Object.entries(data).map(
          ([projectName, projectData]) => ({
            id: projectName,
            name: projectName,
            lists: projectData.lists
              ? Object.entries(projectData.lists).map(([listName]) => ({
                  id: listName,
                  name: listName,
                }))
              : [],
          }),
        );
        setProjects(formattedProjects);
      } else {
        setProjects([]);
      }
    });
  }, [database, teamName]);

  // Генерация случайной строки
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
          subject: "Invite to the Team!",
          message:
            "Link to invite https://hakaton24.netlify.app/invite?name=" +
            teamName +
            "&key=" +
            randomString,
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

  async function submit() {
    const inviteRef = ref(
      database,
      `teams/${teamName}/invites/${randomString}`,
    );
    try {
      const inviteData = {
        inviteCode: randomString,
        role: role,
        from: user.displayName,
        email: email,
      };

      if (role !== "admin") {
        inviteData.access = access;
      }

      await set(inviteRef, inviteData);
      await sendWelcomeEmail(email);
      console.log("Invite created successfully");
    } catch (error) {
      console.error("Error creating invite:", error.code, error.message);
    }
  }

  // Обновление выбранных доступов
  const toggleProject = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    const projectListsKeys = project.lists.map(
      (list) => `${projectId}-${list.id}`,
    );

    if (projectListsKeys.every((key) => access.includes(key))) {
      // Убираем все списки, если они уже выбраны
      setAccess((prevAccess) =>
        prevAccess.filter((key) => !projectListsKeys.includes(key)),
      );
    } else {
      // Добавляем все списки, если хотя бы один не выбран
      setAccess((prevAccess) => [
        ...new Set([...prevAccess, ...projectListsKeys]),
      ]);
    }
  };

  const toggleList = (projectId, listId) => {
    const key = `${projectId}-${listId}`;
    const project = projects.find((p) => p.id === projectId);
    const projectListsKeys = project.lists.map(
      (list) => `${projectId}-${list.id}`,
    );

    setAccess(
      (prevAccess) =>
        prevAccess.includes(key)
          ? prevAccess.filter((item) => item !== key) // Снять галочку с list
          : [...prevAccess, key], // Поставить галочку на list
    );

    // Обновление галочки для проекта
    const updatedAccess = access.includes(key)
      ? access.filter((item) => item !== key)
      : [...access, key];

    if (projectListsKeys.every((listKey) => updatedAccess.includes(listKey))) {
      // Если все lists выбраны, ставим галочку на проект
      setAccess((prevAccess) => [
        ...new Set([...prevAccess, ...projectListsKeys]),
      ]);
    }
  };

  return (
    <div className="invite-on-team">
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="radio">
        <label>
          <input
            type="radio"
            value="view"
            checked={role === "view"}
            onChange={() => setRole("view")}
          />
          View
        </label>
      </div>
      <div className="radio">
        <label>
          <input
            type="radio"
            value="edit"
            checked={role === "edit"}
            onChange={() => setRole("edit")}
          />
          Edit
        </label>
      </div>
      <div className="radio">
        <label>
          <input
            type="radio"
            value="admin"
            checked={role === "admin"}
            onChange={() => setRole("admin")}
          />
          Admin
        </label>
      </div>

      {role !== "admin" && (
        <div>
          {projects.map((project) => (
            <div key={project.id}>
              <label>
                <input
                  type="checkbox"
                  checked={project.lists.every((list) =>
                    access.includes(`${project.id}-${list.id}`),
                  )}
                  onChange={() => toggleProject(project.id)}
                />
                {project.name}
              </label>
              <div style={{ marginLeft: "20px" }}>
                {project.lists.map((list) => (
                  <label key={list.id}>
                    <input
                      type="checkbox"
                      checked={access.includes(`${project.id}-${list.id}`)}
                      onChange={() => toggleList(project.id, list.id)}
                    />
                    {list.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <button onClick={submit}>Пригласить в команду</button>
    </div>
  );
}

export default InviteOnTeam;
