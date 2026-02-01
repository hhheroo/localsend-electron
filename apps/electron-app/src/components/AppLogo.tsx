import logo from '../../public/icon.png';

export function AppLogo() {
  return (
    <img
      src={logo}
      alt="App Logo"
      className="w-50 animate-[spin_10s_linear_infinite]"
    />
  );
}
