export interface Provider {
  id: string;
  email: string;
  salonName: string;
  salonAddress: string;
  salonContact: string;
  servicesOffered: string;
  status: string;
  role: string;
  longitude: string;
  latitude: string;
  isVerified: boolean;
  available: boolean;
  opening_time: string;
  closing_time: string;
  image:string;
  rating:string;
  allFeedback:Feedback[];
  averageRating:string;
  distance:number

}
export interface Feedback{
  rating:string,
  comment:string,
  appointment:{
  service_id:string,
  service:{name:string},
  staff:{name:string}
   },
   customer:{name:string}
}


export interface Service {
  id: string;
  custom_price: string;
  custom_duration: number;
  custom_description: string;
  Service: {
    name: string;
  };
  Category: {
    name: string;
  };
  Staff: {
    name: string;
    phone: string;
  };
}