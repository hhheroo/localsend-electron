import { AppLogo } from '../components/AppLogo';
import { HeaderIcons } from '../components/HeaderIcons';
import { useDeviceInfo } from '../hooks/useDeviceInfo';

export function ReceivePage() {
  const { deviceName, deviceIds } = useDeviceInfo();

  return (
    <main className="flex-1 bg-content-bg flex flex-col h-full relative">
      <HeaderIcons />
      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AppLogo />
        <h2 className="text-5xl font-normal text-black mt-8 mb-2 font-mono tracking-tight">
          {deviceName}
        </h2>
        <div className="flex gap-2">
          {deviceIds.map(id => (
            <span key={id} className="text-xl text-black font-mono">
              {id}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
