import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useRef, useState } from "react";
const auth = getAuth();
const provider = new GoogleAuthProvider();

function Auth() {
  const [isRegistrationSelected, setIsRegistrationSelected] = useState(true);

  const handleRadioChange = (e) => {
    setIsRegistrationSelected(e.target.value === "registration");
  };

  const usernameData = useRef();
  const loginData = useRef();
  const passwordData = useRef();
  const passwordCheck = useRef();

  const registerUser = () => {
    if (passwordData.current.value !== passwordCheck.current.value) {
      return;
    }
    let username = usernameData.current.value;
    let email = loginData.current.value;
    let password = passwordData.current.value;
    createUserWithEmailAndPassword(auth, email, password)
      .then(function () {
        return updateProfile(auth.currentUser, {
          displayName: username,
        });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("🚀 ~ loginUser ~ errorCode:", errorCode);
        console.log("🚀 ~ loginUser ~ errorMessage:", errorMessage);
      });
  };
  const loginUser = () => {
    let email = loginData.current.value;
    let password = passwordData.current.value;
    signInWithEmailAndPassword(auth, email, password).catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log("🚀 ~ loginUser ~ errorCode:", errorCode);
      console.log("🚀 ~ loginUser ~ errorMessage:", errorMessage);
    });
  };

  return (
    <div id="login">
      SingIn
      <div>
        <input
          type="text"
          ref={usernameData}
          style={{ display: isRegistrationSelected ? "block" : "none" }}
        />
        <input type="email" ref={loginData} />
        <input type="password" ref={passwordData} />
        <input
          type="password"
          ref={passwordCheck}
          style={{ display: isRegistrationSelected ? "block" : "none" }}
        />
        <button
          onClick={() => registerUser()}
          style={{ display: isRegistrationSelected ? "block" : "none" }}
        >
          reg
        </button>
        <button
          onClick={() => loginUser()}
          style={{ display: isRegistrationSelected ? "none" : "block" }}
        >
          Login
        </button>
        <div>
          <div>
            <input
              type="radio"
              name="sing"
              value="registration"
              checked={isRegistrationSelected}
              onChange={handleRadioChange}
            />
            <label htmlFor="registration">Registration</label>
          </div>
          <div>
            <input
              type="radio"
              name="sing"
              value="login"
              checked={!isRegistrationSelected}
              onChange={handleRadioChange}
            />
            <label htmlFor="login">Login</label>
          </div>
        </div>
      </div>
      <button onClick={() => signInWithPopup(auth, provider)}>
        Войти с помощью Google
      </button>
    </div>
  );
}

export default Auth;
