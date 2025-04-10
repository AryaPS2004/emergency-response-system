import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  SelectChangeEvent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useEmergency } from '../context/EmergencyContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addEmergency, emergencies, isLoading, error: emergencyError } = useEmergency();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingAddress, setIsGettingAddress] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    location: '',
  });

  const emergencyTypes = [
    'Fire',
    'Medical',
    'Accident',
    'Crime',
    'Natural Disaster',
    'Other'
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    getCurrentLocation();
  }, [user, navigate]);

  const getAddressFromCoordinates = async (lat: number, lon: number) => {
    try {
      setIsGettingAddress(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setCurrentLocation(prev => prev ? { ...prev, address: data.display_name } : null);
        setFormData(prev => ({
          ...prev,
          location: data.display_name,
        }));
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setError('Could not get address from coordinates');
    } finally {
      setIsGettingAddress(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCurrentLocation(location);
        await getAddressFromCoordinates(location.latitude, location.longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Could not get your location. Please enter it manually.');
      }
    );
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmergencyTypeChange = (e: SelectChangeEvent) => {
    setFormData(prev => ({
      ...prev,
      type: e.target.value,
    }));
  };

  const classifyPriority = async (description: string) => {
    try {
      setIsClassifying(true);
      const response = await fetch('http://localhost:5000/api/classify-priority', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to classify priority');
      }
      
      const data = await response.json();
      return data.priority;
    } catch (error) {
      console.error('Error classifying priority:', error);
      return 'medium'; // Default to medium if classification fails
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSendSOS = async () => {
    if (!formData.type || !formData.description || !formData.location) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const locationString = currentLocation ? 
        `${currentLocation.address || `GPS: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`} (Accuracy: ${Math.round(currentLocation.accuracy)}m)` : 
        formData.location;

      // Get priority from classification
      const priority = await classifyPriority(formData.description);

      await addEmergency({
        ...formData,
        location: locationString,
        userId: user.id,
        priority,
      });

      // Reset form
      setFormData({
        type: '',
        description: '',
        location: currentLocation ? 
          `${currentLocation.address || `GPS: ${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`}` : 
          '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send emergency report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'assigned':
        return 'info';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const userEmergencies = emergencies.filter(emergency => emergency.userId === user?.id);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <DashboardHeader title="Emergency Dashboard">
        {isLoading && <CircularProgress size={24} />}
      </DashboardHeader>
      
      {emergencyError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {emergencyError}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Send SOS Signal
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Location:
              </Typography>
              {isLoading ? (
                <CircularProgress size={20} />
              ) : currentLocation ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    <br />
                    Accuracy: ±{currentLocation.accuracy.toFixed(0)} meters
                  </Typography>
                  {isGettingAddress ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Getting address...
                      </Typography>
                    </Box>
                  ) : currentLocation.address ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {currentLocation.address}
                    </Typography>
                  ) : null}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Location not available
                </Typography>
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={getCurrentLocation}
                sx={{ mt: 1 }}
              >
                Refresh Location
              </Button>
            </Box>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Emergency Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleEmergencyTypeChange}
                label="Emergency Type"
              >
                {emergencyTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleTextChange}
              margin="normal"
              multiline
              rows={4}
              required
              helperText={isClassifying ? "Analyzing description to determine priority..." : ""}
            />

            <TextField
              fullWidth
              label="Location (if different from current)"
              name="location"
              value={formData.location}
              onChange={handleTextChange}
              margin="normal"
              required
            />

            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={handleSendSOS}
              disabled={isSubmitting || isClassifying}
              sx={{ mt: 2 }}
            >
              {isSubmitting ? "Sending..." : isClassifying ? "Analyzing..." : "Send SOS Signal"}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Emergency Instructions
            </Typography>
            <Typography variant="body1" paragraph>
              1. Stay calm and assess the situation
            </Typography>
            <Typography variant="body1" paragraph>
              2. Provide clear and accurate information
            </Typography>
            <Typography variant="body1" paragraph>
              3. Follow instructions from emergency responders
            </Typography>
            <Typography variant="body1" paragraph>
              4. Keep your location updated if you move
            </Typography>
          </Paper>

          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Previous Emergencies
            </Typography>
            {userEmergencies.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No emergencies reported yet
              </Typography>
            ) : (
              userEmergencies.map((emergency) => (
                <Accordion key={emergency.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                        {emergency.type}
                      </Typography>
                      <Chip
                        label={emergency.status}
                        color={getStatusColor(emergency.status)}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={emergency.priority}
                        color={getPriorityColor(emergency.priority)}
                        size="small"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Description"
                          secondary={emergency.description}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Location"
                          secondary={emergency.location}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Reported At"
                          secondary={new Date(emergency.timestamp).toLocaleString()}
                        />
                      </ListItem>
                      {emergency.responder && (
                        <>
                          <Divider />
                          <ListItem>
                            <ListItemText
                              primary="Assigned Responder"
                              secondary={emergency.responder}
                            />
                          </ListItem>
                        </>
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboard; 