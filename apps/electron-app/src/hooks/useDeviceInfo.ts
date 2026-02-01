import { useState, useEffect, useMemo } from 'react';
import { logger } from '../utils/logger';

interface DeviceInfo {
  deviceName: string;
  deviceIds: string[];
  ips: string[];
  port: string;
}

// Get last segment of IP address as deviceId
function getDeviceIdFromIp(ip: string): string {
  const parts = ip.split('.');
  return `#${parts[parts.length - 1]}`;
}

export function useDeviceInfo(): DeviceInfo {
  const [baseInfo, setBaseInfo] = useState<{
    deviceName: string;
    ips: string[];
    port: string;
  }>({
    deviceName: 'Loading...',
    ips: [],
    port: '53317'
  });

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      try {
        // Get device info from Electron main process
        if (window.electronAPI) {
          const info = await window.electronAPI.getDeviceInfo();
          setBaseInfo({
            deviceName: info.deviceName,
            ips: info.ips,
            port: info.port
          });
        }
      } catch (error) {
        logger.error('Failed to get device info:', error);
        // Use default values on error
        setBaseInfo({
          deviceName: 'Unknown Device',
          ips: ['0.0.0.0'],
          port: '53317'
        });
      }
    };

    fetchDeviceInfo();
  }, []);

  // Calculate deviceIds from all IPs
  const deviceIds = useMemo(() => {
    if (baseInfo.ips.length > 0) {
      return baseInfo.ips.map(getDeviceIdFromIp);
    }
    return ['#0'];
  }, [baseInfo.ips]);

  return {
    ...baseInfo,
    deviceIds
  };
}
