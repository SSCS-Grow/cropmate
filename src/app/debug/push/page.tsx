'use client';

export default function DebugPush() {
  async function test() {
    const r = await fetch('/api/push/test', { method: 'POST' });
    alert(await r.text());
  }
  return (
    <div className="p-4 space-y-3">
      <h1 className="text-xl font-semibold">Push debug</h1>
      <button onClick={test} className="px-3 py-2 rounded bg-black text-white">Send test</button>
    </div>
  );
}
