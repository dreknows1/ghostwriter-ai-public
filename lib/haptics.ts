/**
 * Haptics seam (docs/PLAN.md "Native-feel layer"). No-op on web — every call
 * is guarded by `isNative()` internally so call sites never need to check
 * the platform themselves.
 */
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './platform';

/** Light tap — step transitions, chip picks, copy actions. */
export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* device without haptics support — ignore */
  }
}

/** Success buzz — generation complete, purchase complete. */
export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* ignore */
  }
}
