function SignUpScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <form
        className="flex min-h-screen flex-col items-center justify-center gap-6 p-8"
        action="submit-signup"
      >
        <label htmlFor="email">Email: </label>
        <input type="text" placeholder="Type your email here..." />

        <label htmlFor="password">Password: </label>
        <input type="password" placeholder="Type your password here..." />

        <input className="hover:cursor-pointer" type="submit" value="Sign Up" />

        <p>
          Already have an account?{" "}
          <span className="text-blue">Login Here</span>
        </p>
      </form>
    </div>
  );
}

export default SignUpScreen;
