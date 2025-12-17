import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegisterMutation } from '../api/Queries/authQueries';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import EmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { signUpSchema, type SignUpFormValues } from '@/lib/schemas/authSchemas';

// Professional restaurant images (Pexels - reliable)
const sliderImages = [
  {
    url: 'https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=1920',
    title: 'Cozy Restaurant Interior',
  },
  {
    url: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1920',
    title: 'Delicious Food Presentation',
  },
];

const SignUp = () => {
  const registerMutation = useRegisterMutation();
  const navigate = useNavigate();

  const [emblaRef] = EmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ]);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '251',
      business: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = (values: SignUpFormValues) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Account created successfully! 🎉', {
          description: 'Please check your email to verify your account.',
        });
      },
      onError: (error: any) => {
        toast.error('Registration failed', {
          description:
            error?.response?.data?.message ||
            'Please check your details and try again.',
        });
      },
    });
  };

  // Success Screen
  if (registerMutation.isSuccess) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-green-600">
              Account Created Successfully!
            </CardTitle>
            <CardDescription className="text-lg mt-4">
              Welcome to your merchant portal. Please check your email to verify
              your account and get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="w-full max-w-xs"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row  bg-background">
      {/* Professional Embla Carousel Slider - 60% */}
      <div className="hidden lg:block lg:w-[60%] relative bg-black overflow-hidden">
        <div className="h-full" ref={emblaRef}>
          <div className="h-full flex">
            {sliderImages.map((image, index) => (
              <div key={index} className="relative h-full flex-shrink-0 w-full">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent pointer-events-none" />

        {/* Text Content */}
        <div className="absolute bottom-16 left-16 text-white max-w-2xl z-10">
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Manage Your Restaurant Like a Pro
          </h1>
          <p className="text-xl lg:text-2xl opacity-95">
            Digital menu, real-time orders, staff management, and tables — all
            in one powerful platform.
          </p>
        </div>
      </div>

      {/* Form Section - 40% */}
      <div className="h-full overflow-y-auto  w-full lg:w-[40%] flex items-center justify-center sm:p-6 lg:p-12  bg-background ">
        <Card className="w-full max-w-md shadow-none border-0 bg-transparent lg:bg-background/95 lg:backdrop-blur lg:pt-10">
          <CardHeader className=" py-8 text-center">
            <CardTitle className="text-3xl font-bold">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-base">
              Start managing your restaurant with ease
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <div className="grid sm:grid-cols-2 gap-4 ">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Joj" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="saka" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="jooo@gmail.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Ethiopian)</FormLabel>
                      <FormControl>
                        <Input placeholder="251944556678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Habesha welytaa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passwordConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg font-medium"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending
                    ? 'Creating Account...'
                    : 'Sign Up'}
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Log in
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
