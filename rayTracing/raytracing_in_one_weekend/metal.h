#ifndef METALH
#define METALH

#include "vec3.h"
#include "ray.h"
#include "material.h"


// Metal material: reflects rays instead of scattering diffusely.
// fuzz=0 is a perfect mirror; higher fuzz gives a rougher, brushed look.
class metal: public material{
public: 
    // Clamp fuzz to max 1 so reflections don't go haywire.
    metal(const vec3& a, float f) : albedo(a){if (f<1) fuzz = f; else fuzz =1;}

    virtual bool scatter(const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered)const{
        // Mirror-bounce the ray off the surface normal.
        vec3 reflected = reflect(unit_vector(r_in.direction()), rec.normal);

        // Add random jitter (scaled by fuzz) for roughness.
        scattered = ray(rec.p, reflected + fuzz * random_in_unit_sphere());
        attenuation = albedo;

        // Only valid if the ray bounces away from the surface, not into it.
        return(dot(scattered.direction(), rec.normal) > 0);

    }
    vec3 albedo;   // base color
    float fuzz;    // roughness, 0 = mirror, 1 = very rough
};
#endif