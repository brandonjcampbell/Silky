import React from 'react';
import { useHistory } from 'react-router-dom';

const Redirector = () => {
  const history = useHistory();

    history.push("/app");

    return (
        <span></span>
    );
}

export default Redirector;