import { createContext, useContext, useState, ReactNode } from 'react';

interface PageContextType {
  title: string;
  description: string;
  setPageInfo: (title: string, description: string) => void;
}

const PageContext = createContext<PageContextType | undefined>(undefined);

export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePageContext must be used within a PageProvider');
  }
  return context;
};

export const PageProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const setPageInfo = (newTitle: string, newDescription: string) => {
    setTitle(newTitle);
    setDescription(newDescription);
  };

  return (
    <PageContext.Provider value={{ title, description, setPageInfo }}>
      {children}
    </PageContext.Provider>
  );
};