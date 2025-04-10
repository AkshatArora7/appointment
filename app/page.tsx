import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-green-500 text-white">
      <h1 className="text-5xl font-bold mb-8">Welcome to the Appointment Booking System</h1>
      <div className="space-x-4">
        <Link 
          href="/login" 
          className="px-6 py-3 bg-blue-700 rounded-lg shadow-lg hover:bg-blue-800 transition duration-300"
        >
          Login
        </Link>
        <Link 
          href="/book-appointment" 
          className="px-6 py-3 bg-green-700 rounded-lg shadow-lg hover:bg-green-800 transition duration-300"
        >
          Book Appointment
        </Link>
      </div>
    </div>
  );
}
