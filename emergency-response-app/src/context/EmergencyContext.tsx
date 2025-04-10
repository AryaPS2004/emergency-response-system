import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Emergency {
  id: string;
  type: string;
  description: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'assigned' | 'resolved';
  timestamp: number;
  userId: string;
  responder?: string;
}

interface EmergencyContextType {
  emergencies: Emergency[];
  addEmergency: (emergency: {
    type: string;
    description: string;
    location: string;
    priority: 'low' | 'medium' | 'high';
    userId: string;
  }) => Promise<void>;
  updateEmergencyStatus: (id: string, status: Emergency['status']) => Promise<void>;
  assignResponder: (emergencyId: string, responderId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const EmergencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch emergencies from MongoDB
  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/emergencies');
        if (!response.ok) throw new Error('Failed to fetch emergencies');
        const data = await response.json();
        setEmergencies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch emergencies');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmergencies();
  }, []);

  const addEmergency = async (emergency: {
    type: string;
    description: string;
    location: string;
    priority: 'low' | 'medium' | 'high';
    userId: string;
  }) => {
    try {
      const response = await fetch('http://localhost:5000/api/emergencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergency),
      });

      if (!response.ok) throw new Error('Failed to create emergency');
      const newEmergency = await response.json();
      setEmergencies(prev => [...prev, newEmergency]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create emergency');
      throw err;
    }
  };

  const updateEmergencyStatus = async (id: string, status: Emergency['status']) => {
    try {
      const response = await fetch(`http://localhost:5000/api/emergencies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update emergency status');
      
      setEmergencies(prev =>
        prev.map(emergency =>
          emergency.id === id ? { ...emergency, status } : emergency
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update emergency status');
      throw err;
    }
  };

  const assignResponder = async (emergencyId: string, responderId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/emergencies/${emergencyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'assigned',
          responder: responderId 
        }),
      });

      if (!response.ok) throw new Error('Failed to assign responder');
      
      setEmergencies(prev =>
        prev.map(emergency =>
          emergency.id === emergencyId
            ? { ...emergency, status: 'assigned', responder: responderId }
            : emergency
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign responder');
      throw err;
    }
  };

  return (
    <EmergencyContext.Provider
      value={{
        emergencies,
        addEmergency,
        updateEmergencyStatus,
        assignResponder,
        isLoading,
        error,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
}; 