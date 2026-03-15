import axios from 'axios';

const API = axios.create({
  baseURL: 'https://dental-backend-production-23c5.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auth
export const loginApi          = (data)      => API.post('/auth/login', data);

// Patients
export const getPatientsApi    = ()          => API.get('/patients');
export const addPatientApi     = (data)      => API.post('/patients', data);
export const getPatientApi     = (id)        => API.get(`/patients/${id}`);
export const updatePatientApi  = (id, data)  => API.put(`/patients/${id}`, data);
export const deletePatientApi  = (id)        => API.delete(`/patients/${id}`);
export const searchPatientsApi = (q)         => API.get(`/patients/search?q=${q}`);
export const getStatsApi       = ()          => API.get('/patients/stats');

// Visits
export const getVisitsApi      = (patientId) => API.get(`/visits/patient/${patientId}`);
export const addVisitApi       = (data)      => API.post('/visits', data);
export const updateVisitApi    = (id, data)  => API.put(`/visits/${id}`, data);
export const deleteVisitApi    = (id)        => API.delete(`/visits/${id}`);
export const getFollowUpsApi   = ()          => API.get('/visits/followups');

// Appointments
export const getTodayAppointmentsApi = ()         => API.get('/appointments/today');
export const getAppointmentsByDateApi= (date)     => API.get(`/appointments/date/${date}`);
export const addAppointmentApi       = (data)     => API.post('/appointments', data);
export const updateAppointmentApi    = (id, data) => API.put(`/appointments/${id}`, data);
export const deleteAppointmentApi    = (id)       => API.delete(`/appointments/${id}`);

// Reports
export const uploadReportApi  = (patientId, formData) =>
  API.post(`/reports/upload/${patientId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getReportsApi    = (patientId) => API.get(`/reports/list/${patientId}`);
export const deleteReportApi  = (patientId, fileName) => API.delete(`/reports/delete/${patientId}/${fileName}`);
export const getReportViewUrl = (patientId, fileName) => `https://dental-backend-production-23c5.up.railway.app/api/reports/view/${patientId}/${fileName}`;

// Billing
export const getBillingApi    = (patientId)        => API.get(`/patients/${patientId}/billing`);
export const addPaymentApi    = (patientId, data)  => API.post(`/patients/${patientId}/billing/payment`, data);