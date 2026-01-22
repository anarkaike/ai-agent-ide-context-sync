import React from 'react';

interface MyButtonProps {
  children?: React.ReactNode;
}

export const MyButton: React.FC<MyButtonProps> = ({ children }) => {
  return (
    <div className="MyButton">
      {children}
    </div>
  );
};
