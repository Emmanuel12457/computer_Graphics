#ifndef LAMBERTIANH
#define LAMBERTIANH 

#include "ray.h"
#include "hitable.h"
#include "material.h"

// Lambertian material: diffuse (matte) surface. Scatters light in a random
// direction biased toward the surface normal, giving a soft, non-shiny look.
class lambertian: public material{
public:
    lambertian(const vec3& a) : albedo(a){}

    virtual bool scatter(const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered) const{
        // Pick a random target point just above the surface, offset from the
        // normal by a random point in a unit sphere — this biases the scatter
        // direction toward the normal without being purely random.
        vec3 target = rec.p + rec.normal + random_in_unit_sphere();
        scattered = ray(rec.p, target - rec.p);
        attenuation = albedo;   // tints the scattered light with the surface color
        return true;
    };
    vec3 albedo;   // base color of the surface
};

#endif