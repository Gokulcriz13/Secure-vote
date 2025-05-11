// pages/about.tsx

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-blue-50 text-gray-800 p-10">
      <h1 className="text-4xl font-bold text-blue-700 mb-6">About eVote India</h1>
      <p className="text-lg max-w-3xl">
        eVote India is a revolutionary online voting platform designed to
        empower citizens with a secure, transparent, and accessible way to cast
        their vote. Using cutting-edge technologies like blockchain, multi-factor
        authentication, and end-to-end encryption, we aim to ensure every vote
        is counted fairly and securely.
      </p>

      <div className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-700">Why Choose Us?</h2>
        <ul className="list-disc list-inside text-lg">
          <li><span className="font-medium">Security:</span> Advanced authentication and encryption.</li>
          <li><span className="font-medium">Transparency:</span> Blockchain ensures auditability.</li>
          <li><span className="font-medium">Accessibility:</span> Vote from anywhere in India.</li>
          <li><span className="font-medium">Privacy:</span> Your identity stays protected.</li>
        </ul>
      </div>
    </div>
  );
}
