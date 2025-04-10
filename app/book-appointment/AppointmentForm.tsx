import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AppointmentFormValues, Service } from '@/types/interfaces';

interface AppointmentFormProps {
  onSubmit: (values: AppointmentFormValues) => void;
  isSubmitting: boolean;
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedService: number | null;
  services: Service[];
  onServiceSelect: (serviceId: number) => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSubmit,
  isSubmitting,
  selectedDate,
  selectedTime,
  selectedService,
  services,
  onServiceSelect
}) => {
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      phone: Yup.string().required('Phone number is required'),
    }),
    onSubmit,
  });

  const isButtonDisabled = !selectedDate || !selectedTime || !selectedService || isSubmitting || !formik.isValid;

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      {/* Service Selection */}
      <div>
        <h3 className="font-medium mb-3">Choose a Service</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((service) => {
            // Determine which price to display - client-specific or default
            const displayPrice = service.price || service.price;
            
            return (
              <div 
                key={service.id}
                onClick={() => onServiceSelect(service.id)}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedService === service.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'}
                `}
              >
                <div className="flex justify-between">
                  <h4 className="font-medium">{service.name}</h4>
                  <span className="font-bold">${displayPrice}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {service.duration} minutes
                </p>
                {service.description && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {service.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
        <h3 className="font-medium mb-3">Your Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              {...formik.getFieldProps('name')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 dark:bg-gray-800"
            />
            {formik.touched.name && formik.errors.name ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...formik.getFieldProps('email')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 dark:bg-gray-800"
            />
            {formik.touched.email && formik.errors.email ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.email}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              {...formik.getFieldProps('phone')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 dark:bg-gray-800"
            />
            {formik.touched.phone && formik.errors.phone ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.phone}</p>
            ) : null}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isButtonDisabled}
              className={`
                w-full py-3 px-6 rounded-lg font-medium transition duration-200
                ${isButtonDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'}
              `}
            >
              {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AppointmentForm;
