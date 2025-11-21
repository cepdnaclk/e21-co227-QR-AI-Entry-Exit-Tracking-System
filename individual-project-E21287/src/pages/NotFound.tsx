import { useLocation } from "react-router-dom"; // Hook to access current URL/location
import { useEffect } from "react"; // React hook for running side effects

const NotFound = () => {
  const location = useLocation(); 
  // useLocation() gives information about the current URL (like pathname)

  useEffect(() => {
    // This effect runs whenever the user navigates to a different path
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    // Logs the path the user tried to access in the browser console
  }, [location.pathname]); // Dependency ensures effect runs when pathname changes

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      {/* Full-page centered layout with light gray background */}
      <div className="text-center">
        {/* Centered text content */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        {/* Large bold "404" error heading */}
        <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
        {/* User-friendly error message */}
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          {/* Link back to home page */}
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound; 
