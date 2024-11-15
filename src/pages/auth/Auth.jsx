import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail, // Импортируем метод для сброса пароля
} from "firebase/auth";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const auth = getAuth();
const provider = new GoogleAuthProvider();

function Auth() {
  const [isRegistrationSelected, setIsRegistrationSelected] = useState(true);
  const [resetEmail, setResetEmail] = useState(""); // Для хранения email для сброса
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        navigate("/createteam");
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auth, navigate]);

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
        return (
          updateProfile(auth.currentUser, {
            displayName: username,
          }) && navigate("/createteam")
        );
      })
      .catch((error) => {
        console.error("Error during registration:", error.message);
      });
  };

  const loginUser = () => {
    let email = loginData.current.value;
    let password = passwordData.current.value;
    signInWithEmailAndPassword(auth, email, password)
      .then(function () {
        navigate("/createteam");
      })
      .catch((error) => {
        console.error("Error during login:", error.message);
      });
  };

  const forgetPassword = () => {
    if (!resetEmail) {
      alert("Please enter your email to reset your password.");
      return;
    }
    sendPasswordResetEmail(auth, resetEmail)
      .then(() => {
        alert("Password reset email sent. Please check your inbox.");
      })
      .catch((error) => {
        console.error("Error during password reset:", error.message);
      });
  };

  return (
    <div id="login">
      <h1>Sign In</h1>
      <div>
        <span>Username</span>
        <input
          type="text"
          ref={usernameData}
          style={{ display: isRegistrationSelected ? "block" : "none" }}
        />
        <span>Email</span>
        <input type="email" ref={loginData} />
        <span>Password</span>
        <input type="password" ref={passwordData} />
        <span>Confirm Password</span>
        <input
          type="password"
          ref={passwordCheck}
          style={{ display: isRegistrationSelected ? "block" : "none" }}
        />
        <button
          onClick={registerUser}
          style={{ display: isRegistrationSelected ? "block" : "none" }}
        >
          Register
        </button>
        <button
          onClick={loginUser}
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
        Sign in with Google
      </button>
      <div>
        <h2>Forgot Password?</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
        />
        <button onClick={forgetPassword}>Reset Password</button>
      </div>
    </div>
  );
}

export default Auth;
