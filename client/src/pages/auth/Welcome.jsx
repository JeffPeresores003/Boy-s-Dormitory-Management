import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeLoading from '../../shared/WelcomeLoading';

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for animation to finish before redirecting
    const timer = setTimeout(() => {
      navigate('/admin');
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <WelcomeLoading />
    </div>
  );
};

export default Welcome;
