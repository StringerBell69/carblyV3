/**
 * Feature flags pour activer/désactiver des fonctionnalités
 */

export const isYousignEnabled = (): boolean => {
  return process.env.YOUSIGN_ENABLED === 'true';
};
