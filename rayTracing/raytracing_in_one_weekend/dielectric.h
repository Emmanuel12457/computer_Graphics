#ifndef DIELECTRICH
#define DIELECTRICH
#include "vec3.h"
#include "ray.h"
#include "hitable.h"
#include "material.h"

// Approximates how reflectivity changes with viewing angle (glass looks more
// mirror-like at grazing angles). cosine is the angle to the normal, ref_idx
// is the material's refractive index.
float schlick(float cosine, float ref_idx){ 
    float r0 = (1-ref_idx) / (1+ ref_idx);
    r0 = r0 * r0;
    return r0 + (1-r0) * pow((1-cosine), 5);
}

// Dielectric material: glass/water-like. Rays either refract (bend through)
// or reflect (bounce off), decided probabilistically per Schlick's approximation.
class dielectric: public material{
public: 
    dielectric(float ri) : ref_idx(ri) {}

    virtual bool scatter(const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered) const{
        vec3 outward_normal;
        vec3 reflected = reflect(r_in.direction(), rec.normal);
        float ni_over_nt;
        attenuation = vec3(1.0,1.0,1.0);   // glass doesn't tint color, just bends light
        vec3 refracted;
        float reflect_prob;
        float cosine;

        // Determine if the ray is exiting or entering the glass, and set the
        // refractive index ratio (ni_over_nt) and angle-to-normal accordingly.
        if(dot(r_in.direction(), rec.normal) > 0){
            outward_normal = rec.normal;
            ni_over_nt = ref_idx;
            cosine = ref_idx * dot(r_in.direction(), rec.normal) / r_in.direction().length();
        }
        else{
            outward_normal = rec.normal;
            ni_over_nt = 1.0 / ref_idx;
            cosine =  -dot(r_in.direction(), rec.normal) / r_in.direction().length();

        }

        // Try to refract; if it's not possible (total internal reflection),
        // the ray must reflect instead.
        if(refract(r_in.direction(), outward_normal, ni_over_nt, refracted)){
            reflect_prob = schlick(cosine, ref_idx);
        }
        else{
            scattered = ray(rec.p, reflected);
            reflect_prob = 1.0;
        }

        // Randomly choose reflect vs refract, weighted by reflect_prob.
        if(drand48() < reflect_prob){
            scattered = ray(rec.p, reflected);
        }
        else{
            scattered = ray(rec.p, refracted);
        }
        return true;
    }
    float ref_idx;   // refractive index (e.g. 1.5 for glass)

};

#endif