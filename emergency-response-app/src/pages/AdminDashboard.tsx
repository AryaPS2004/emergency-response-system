import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import TimelineIcon from '@mui/icons-material/Timeline';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useEmergency } from '../context/EmergencyContext';
import DashboardHeader from '../components/DashboardHeader';

const AdminDashboard = () => {
  const { emergencies, updateEmergencyStatus } = useEmergency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'error';
      case 'pending':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'default';
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

  const activeEmergencies = emergencies.filter(e => e.status === 'assigned').length;
  const pendingEmergencies = emergencies.filter(e => e.status === 'pending').length;
  const resolvedEmergencies = emergencies.filter(e => e.status === 'resolved').length;

  // Sort emergencies by priority (high first) and then by timestamp (newest first)
  const sortedEmergencies = [...emergencies].sort((a, b) => {
    const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return b.timestamp - a.timestamp;
  });

  return (
    <DashboardHeader title="Emergency Response System - Admin Dashboard">
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            {/* Statistics Cards */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6">Active Emergencies</Typography>
                  </Box>
                  <Typography variant="h3">{activeEmergencies}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimelineIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Pending Emergencies</Typography>
                  </Box>
                  <Typography variant="h3">{pendingEmergencies}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AnalyticsIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Resolved Emergencies</Typography>
                  </Box>
                  <Typography variant="h3">{resolvedEmergencies}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Emergency Table */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                  All Emergencies
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedEmergencies.map((emergency) => (
                        <TableRow key={emergency.id}>
                          <TableCell>{emergency.id}</TableCell>
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
                            <Chip
                              label={emergency.status}
                              color={getStatusColor(emergency.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {emergency.status !== 'resolved' && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => updateEmergencyStatus(emergency.id, 'resolved')}
                              >
                                Mark Resolved
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </DashboardHeader>
  );
};

export default AdminDashboard; 