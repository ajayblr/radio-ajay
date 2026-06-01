export type CarEnvironment = 'carplay' | 'android-auto' | 'none';

function detect(): CarEnvironment {
  const ua = navigator.userAgent;
  if (ua.includes('CarPlay')) return 'carplay';
  if (/Automotive/i.test(ua) || ua.includes('AndroidAuto')) return 'android-auto';
  return 'none';
}

export function useCarEnvironment() {
  const env = detect();
  return {
    env,
    isCarEnvironment: env !== 'none',
    label: env === 'carplay' ? 'CarPlay' : env === 'android-auto' ? 'Android Auto' : null,
  };
}
