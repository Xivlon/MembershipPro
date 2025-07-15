import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SelectPlan = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get("plan");

    if (plan) {
      navigate(`/checkout/${plan}`);
    } else {
      navigate("/plans"); // fallback page
    }
  }, [location]);

  return <p>Redirecting to your plan...</p>;
};

export default SelectPlan;
