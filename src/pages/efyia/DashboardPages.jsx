import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { analyticsApi, authApi, bookingsApi, reviewsApi, studioProfileApi, studiosApi, usersApi, depositApi, websiteApi } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import TeamManager from '../../components/studio/TeamManager';
import StudioSwitcher from '../../components/studio/StudioSwitcher';
import {
  EmptyState,
  ErrorMessage,
  SectionHeading,
  Spinner,
  StudioCard,
} from '../../components/efyia/ui';
import ProfileSetupWizard from '../../components/studio/ProfileSetupWizard';
import StudioStripeOnboarding from '../../components/stripe/StudioStripeOnboarding';
import BookingCheckout from '../../components/stripe/BookingCheckout';
import FileList from '../../components/booking/FileList';
import BookingDetailModal from '../../components/booking/BookingDetailModal';
import RevenueChart from '../../components/studio/RevenueChart';
import AvailabilityManager from '../../components/studio/AvailabilityManager';
import { canRevealBookingAddress, getPrivateAddress } from '../../lib/location';
import EmailDomainManager from '../../components/efyia/EmailDomainManager';