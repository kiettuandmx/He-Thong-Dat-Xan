import React from 'react';
import { useLocation } from 'react-router-dom';
import RecurringBookingPanel, {
  defaultRecurringFieldState,
} from '../components/RecurringBookingPanel';

const RecurringBookingPage = () => {
  const location = useLocation();
  const field = location.state?.field || defaultRecurringFieldState;

  return (
    <div className="detail-page recurring-page">
      <RecurringBookingPanel field={field} />
    </div>
  );
};

export default RecurringBookingPage;
