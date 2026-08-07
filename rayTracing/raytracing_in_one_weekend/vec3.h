#ifndef VEC3H
#define VEC3H

#include <math.h>
#include <stdlib.h>
#include <iostream>

/**
 * A class used to represent everything in the scene. The points, colors, and directions are all vectors.
 * A vector takes in  3 parameters and creates a list.
 */
class vec3{
    public:
    vec3(){}
    //constructor
    vec3(float e0, float e1, float e2){e[0] = e0; e[1] = e1; e[2] = e2; }
    //point vector
    inline float x() const {return e[0]; }
    inline float y() const {return e[1]; }
    inline float z() const {return e[2]; }
    //color vector
    inline float r() const {return e[0]; }
    inline float g() const {return e[1]; }
    inline float b() const {return e[2]; }

    inline const vec3& operator+() const {return *this; }
    inline vec3 operator-() const {return vec3(-e[0], -e[1], -e[2]); }
    inline float operator[](int i) const {return e[i]; }
    inline float& operator[](int i){ return e[i]; }
    
    inline vec3& operator+=(const vec3 &v2);
    inline vec3& operator-=(const vec3 &v2);
    inline vec3& operator*=(const vec3 &v2);
    inline vec3& operator/=(const vec3 &v2);
    inline vec3& operator*=(const float t);
    inline vec3& operator/=(const float t);

    inline float length() const{ return sqrt(e[0] * e[0] + e[1] * e[1] + e[2] * e[2]); }
    inline float squared_length() const { return (e[0]* e[0] + e[1] * e[1] + e[2] * e[2]); }
    inline void make_unit_vector();

    float e[3];

};

//These are functions that handle vector math between two vec3s or a float and a vector e.g
//the dot and cross product, addition of vectors, etc..


inline vec3 operator+(const vec3 &v1, const vec3 &v2){
   return vec3(v1.e[0] + v2.e[0], v1.e[1]+ v2.e[1], v1.e[2] + v2.e[2]); 
}
inline vec3 operator-(const vec3 &v1, const vec3 &v2){
   return vec3(v1.e[0] - v2.e[0], v1.e[1]- v2.e[1], v1.e[2] - v2.e[2]); 
}
inline vec3 operator*(const vec3 &v1, const vec3 &v2){
   return vec3(v1.e[0] * v2.e[0], v1.e[1] * v2.e[1], v1.e[2] * v2.e[2]); 
}
inline vec3 operator/(const vec3 &v1, const vec3 &v2){
   return vec3(v1.e[0] / v2.e[0], v1.e[1]/ v2.e[1], v1.e[2] / v2.e[2]); 
}
inline float dot(const vec3 &v1, const vec3 &v2){
   return v1.e[0]* v2.e[0] + v1.e[1] * v2.e[1] + v1.e[2] * v2.e[2]; 
}
inline vec3 cross(const vec3 &v1, const vec3 &v2){
    return vec3((v1.e[1] * v2.e[2] - v1.e[2] * v2.e[1]),
    (-(v1.e[0] * v2.e[2])- v1.e[2] * v2.e[0]), 
    (v1.e[0] * v2.e[1] - v1.e[1] * v2.e[0]));
}
inline vec3 operator*(float t, const vec3 &v) {
    return vec3(t*v.e[0], t*v.e[1], t*v.e[2]);
}

inline vec3 operator*(const vec3 &v, float t) {
    return vec3(t*v.e[0], t*v.e[1], t*v.e[2]);
}

inline vec3 operator/(vec3 v, float t) {
    return vec3(v.e[0]/t, v.e[1]/t, v.e[2]/t);
}

inline vec3& vec3::operator+=(const vec3 &v) {
    e[0] += v.e[0];
    e[1] += v.e[1];
    e[2] += v.e[2];
    return *this;
}

inline vec3& vec3::operator-=(const vec3& v) {
    e[0] -= v.e[0];
    e[1] -= v.e[1];
    e[2] -= v.e[2];
    return *this;
}

inline vec3& vec3::operator*=(const vec3 &v) {
    e[0] *= v.e[0];
    e[1] *= v.e[1];
    e[2] *= v.e[2];
    return *this;
}

inline vec3& vec3::operator/=(const vec3 &v) {
    e[0] /= v.e[0];
    e[1] /= v.e[1];
    e[2] /= v.e[2];
    return *this;
}

inline vec3& vec3::operator*=(const float t) {
    e[0] *= t;
    e[1] *= t;
    e[2] *= t;
    return *this;
}

inline vec3& vec3::operator/=(const float t) {
    float k = 1.0/t;
    e[0] *= k;
    e[1] *= k;
    e[2] *= k;
    return *this;
}

/**
 * Modifies the vector it is called on and scales it down to unit length
 */
inline void vec3::make_unit_vector() {
    float k = 1.0 / sqrt(e[0]*e[0] + e[1]*e[1] + e[2]*e[2]);
    e[0] *= k;
    e[1] *= k;
    e[2] *= k;
}
/**
 * returns a new unit vector
 */
inline vec3 unit_vector(vec3 v){return v / v.length();}

/**
 * generates a random point uniformly distributed inside a unit sphere
 */
 inline vec3 random_in_unit_sphere(){
    vec3 p;
    do {
        p = 2.0 * vec3(drand48(), drand48(),drand48()) - vec3(1,1,1);
    }
    while (dot(p,p) >= 1.0);

    return p;
    
}

/**
 * computes the direction v bounces to when it hits a surface with normal(n)
 * 
 */
inline vec3 reflect(const vec3& v, const vec3& n){
    return v - 2 * dot(v,n) * n;
}

/**
 * computes the direction a ray bends when passing through  a boundary
 * between two materials with different refractive indices using snell's law
 */
inline bool  refract(const vec3& v, const vec3& n, float ni_over_nt, vec3& refracted){
    vec3 uv = unit_vector(v);
    float dt = dot(uv, n);
    float discriminant = 1.0 - ni_over_nt * ni_over_nt*(1-dt*dt);
    if(discriminant > 0){
        refracted = ni_over_nt * (uv - n*dt) - n*sqrt(discriminant);
        return true;
    }
    else
        return false;

}

#endif