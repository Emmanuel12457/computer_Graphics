#ifndef SPHEREH
#define SPHEREH

#include "hitable.h"

/**
 * A sphere is an object of type hitable
 * It takes 3 parameters: the center, radius, and material
 */
class sphere: public hitable{
    public:
        sphere(){}
        sphere(vec3 cen, float r, material *m) : center(cen), radius(r), mat_ptr(m) {};
        virtual bool hit(const ray& r, float tmin, float tmax, hit_record& rec) const;
        vec3 center;
        float radius;
        material *mat_ptr;
};

/**
 * Collision detection - substitutes the parametric equation for the ray into the equation of a sphere
 * this results in a quadratic equation. We then check, using the discriminant, for point(s)  of intersection 
 * if there is any
 * 
 * @param r the incoming ray
 * @param t_min lower bound of valid hit distances
 * @param t_max upper bound  of valid hit distances. Used by hitable_list to find the 
 * closest hit
 * @param rec contains hit details  if there is a hit

 */
bool sphere :: hit(const ray& r, float t_min, float t_max, hit_record& rec) const {
    vec3 oc = r.origin() - center;
    float a = dot(r.direction(), r.direction());
    float b = dot(oc, r.direction());
    float c = dot(oc, oc) - radius * radius;
    float discriminant = b*b - a * c;
    if(discriminant > 0){
        float temp = (-b - sqrt(b*b -a * c))/ a;
        if(temp < t_max && temp > t_min){
            rec.t = temp;
            rec.p = r.point_at_parameter(rec.t);
            rec.normal = (rec.p - center) / radius;
            rec.mat_ptr = mat_ptr;
            return true;
        }
    }
    return false;
}


#endif