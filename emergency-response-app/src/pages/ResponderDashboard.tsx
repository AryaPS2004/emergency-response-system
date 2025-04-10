import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarningIcon from '@mui/icons-material/Warning';
import { useEmergency } from '../context/EmergencyContext';
import { useAuth } from '../context/AuthContext';
import DashboardHeader from '../components/DashboardHeader';

const ResponderDashboard = () => {
  const { user } = useAuth();
  const { emergencies, assignResponder, updateEmergencyStatus } = useEmergency();
  const [selectedEmergency, setSelectedEmergency] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleAcceptEmergency = (id: string) => {
    setOpenDialog(true);
    setSelectedEmergency(id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmergency(null);
  };

  const handleConfirmAccept = async () => {
    if (selectedEmergency && user?.id) {
      try {
        await assignResponder(selectedEmergency, user.id);
        handleCloseDialog();
      } catch (error) {
        console.error('Failed to accept emergency:', error);
      }
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

  const getPriorityWeight = (priority: string) => {
    switch (priority) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 0;
    }
  };

  const pendingEmergencies = emergencies
    .filter(e => e.status === 'pending')
    .sort((a, b) => {
      const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp - a.timestamp;
    });

  const assignedEmergencies = emergencies
    .filter(e => e.status === 'assigned')
    .sort((a, b) => {
      const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp - a.timestamp;
    });

  return (
    <DashboardHeader title="Emergency Response System - Responder Dashboard">
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            {/* Status Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your Status
                  </Typography>
                  <Chip
                    label="Available"
                    color="success"
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    You are currently available to respond to emergencies
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Pending Emergencies */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Available Emergencies
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingEmergencies.map((emergency) => (
                      <TableRow key={emergency.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <WarningIcon color="error" sx={{ mr: 1 }} />
                            {emergency.type}
                          </Box>
                        </TableCell>
                        <TableCell>{emergency.description}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="body2">{emergency.location}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emergency.priority.toUpperCase()}
                            color={getPriorityColor(emergency.priority)}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handleAcceptEmergency(emergency.id)}
                            disabled={emergency.status === 'resolved'}
                          >
                            Respond
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            {/* Assigned Emergencies */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Your Assigned Emergencies
                </Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignedEmergencies.map((emergency) => (
                      <TableRow key={emergency.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <WarningIcon color="error" sx={{ mr: 1 }} />
                            {emergency.type}
                          </Box>
                        </TableCell>
                        <TableCell>{emergency.description}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="body2">{emergency.location}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={emergency.priority.toUpperCase()}
                            color={getPriorityColor(emergency.priority)}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => updateEmergencyStatus(emergency.id, 'resolved')}
                          >
                            Mark Resolved
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Confirmation Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Accept Emergency</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to accept this emergency? You will be responsible for responding to it.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleConfirmAccept} variant="contained" color="primary">
              Accept
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardHeader>
  );
};

export default ResponderDashboard; 