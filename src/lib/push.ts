import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;
const subject = process.env.VAPID_SUBJECT!;

webpush.setVapidDetails(subject, publicKey, privateKey);

export async function sendPush(subscription: any, payload: any) {
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}
