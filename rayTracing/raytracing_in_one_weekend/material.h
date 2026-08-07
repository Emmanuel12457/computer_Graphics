#ifndef MATERIALH
#define MATERIALH
#include "ray.h"
#include "hitable.h"

/**
 * an abstract class used to define the material of an object
 */
class material{
    public: 
        virtual bool scatter(const ray& r_in, const hit_record& rec, vec3& attenuation, ray& scattered)const = 0;   
};
#endif