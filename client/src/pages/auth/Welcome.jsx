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

  return <WelcomeLoading />;
};

export default Welcome;
