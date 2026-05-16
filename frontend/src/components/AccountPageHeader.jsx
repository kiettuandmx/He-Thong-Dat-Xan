import React from 'react';
import PropTypes from 'prop-types';

const AccountPageHeader = ({ eyebrow, title, description, action }) => (
  <header className="account-page-header">
    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  </header>
);

AccountPageHeader.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  action: PropTypes.node,
};

AccountPageHeader.defaultProps = {
  eyebrow: 'Tài khoản',
  action: null,
};

export default AccountPageHeader;
