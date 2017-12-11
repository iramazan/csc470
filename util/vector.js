/*
 * 4 dimensional vector class
 */
class vec4 {
    constructor(x, y, z, w) {
        this._x = x;
        this._y = y;
        this._z = z;
        this._w = w;
    }
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get z() {
        return this._z;
    }
    set x(x) {
        this._x = x;
    }
    set y(y) {
        this._y = y;
    }
    set z(z) {
        this._z = z;
    }
    as_array() {
        return [this._x, this._y, this._z, this._w];
    }
    addv(v) {
        return new vec4(
            this._x + v.x,
            this._y + v.y,
            this._z + v.z,
            1
        );
    }
    subv(v) {
        return new vec4(
            this._x - v.x,
            this._y - v.y,
            this._z - v.z,
            1
        );
    }
    multc(c) {
        return new vec4(
            this._x * c,
            this._y * c,
            this._z * c,
            1
        );
    }
    divc(c) {
        return new vec4(
            this._x / c,
            this._y / c,
            this._z / c,
            1
        );
    }
}

/*
 * Add 3d vectors a and b
 */
function add3(a, b)
{
    return [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2]
    ];
}

/*
 * Subtract 3d vector b from 3d vector a
 */
function sub3(a, b)
{
    return [
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2],
    ];
}

/*
 * Multiple vec3 v by constant c
 */
function multcv3(c, v)
{
    return [c * v[0], c * v[1], c * v[2]];
}

/*
 * Normalize a vector of length 3
 */
function norm3(v) {
    var length = Math.sqrt(
        v[0] * v[0] + v[1] * v[1] + v[2] * v[2]
    );
    return [
        v[0] / length,
        v[1] / length,
        v[2] / length
    ];
}

/*
 * Calculate the cross product of 2 3d vectors
 */
function cross3(a, b)
{
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

/*
 * Calculate the dot product of 2 3d vectors
 */
function dot3(a, b)
{
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

/*
 * Create a matrix to perform a shift by x, y, z
 */
function shift(x, y, z)
{
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ];
}

/*
 * Create a matrix to rotate around the z axis by theta t
 */
function rotate_X(t)
{
    return [
        1, 0,            0,           0,
        0, Math.cos(t), -Math.sin(t), 0,
        0, Math.sin(t),  Math.cos(t), 0,
        0, 0,            0,           1
    ];
}

/*
 * Create a matrix to rotate around the y axis by theta t
 */
function rotate_Y(t)
{
    return [
         Math.cos(t), 0, Math.sin(t), 0,
         0,           1,           0, 0,
        -Math.sin(t), 0, Math.cos(t), 0,
        0,            0,           0, 1
    ];
}

/*
 * Create a matrix to rotate around the z axis by theta t
 */
function rotate_Z(t)
{
    return [
        Math.cos(t), -Math.sin(t), 0, 0,
        Math.sin(t),  Math.cos(t), 0, 0,
        0,            0,           1, 0,
        0,            0,           0, 1
    ];
}

/*
 * Create a matrix to scale by a factor of f
 */
function scale(f)
{
    return [
        f, 0, 0, 0,
        0, f, 0, 0,
        0, 0, f, 0,
        0, 0, 0, 1
    ];
}

/*
 * Create a perspective projection matrix
 */
function persp(fov, asp, near, far)
{
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    var inv = 1.0 / (near - far);
    return [
        f / asp, 0, 0,                     0,
        0,       f, 0,                     0,
        0,       0, (near + far) * inv,   -1,
        0,       0, near * far * inv * 2,  0
    ];
}

/*
 * Create an orthographic projection matrix
 */
function ortho(l, r, t, b, n, f)
{
    var lr = 1 / (l - r);
    var bt = 1 / (b - t);
    var nf = 1 / (n - f);
    return [
        -2 * lr,        0,            0,            0,
         0,            -2 * bt,       0,            0,
         0,             0,            2 * nf,       0,
         (l + r) * lr,  (t + r) * bt, (f + n) * nf, 1
    ];
}

/*
 * Create view matrix derived from eye viewing point
 * Based on glm::lookAt function
 */
function look_at(eye, target, up)
{
    var z = norm3(sub3(eye, target));
    var x = norm3(cross3(up, z));
    var y = cross3(z, x);
    var b1 = -dot3(x, eye);
    var b2 = -dot3(y, eye);
    var b3 = -dot3(z, eye);
    return [
        x.x, y.x, z.x, 0,
        x.y, y.y, z.y, 0,
        x.z, y.z, z.z, 0,
        b1,  b2,  b3,  1
    ];
}

// find cross product of two vectors in array vecs
// starting at indices i1 and i2 respectively
function surface_normal(vecs, i1, i2, i3, shift_x, shift_y)
{
    // get three vertices
    var v1 = [vecs[i1]+shift_x, vecs[i1+1]+shift_y, vecs[i1+2], vecs[i1+3]];
    var v2 = [vecs[i2]+shift_x, vecs[i2+1]+shift_y, vecs[i2+2], vecs[i2+3]];
    var v3 = [vecs[i3]+shift_x, vecs[i3+1]+shift_y, vecs[i3+2], vecs[i3+3]];
    // get two edge vectors
    var vec1 = [v2[0]-v1[0], v2[1]-v1[1], v2[2]-v1[2], 1];
    var vec2 = [v3[0]-v1[0], v3[1]-v1[1], v3[2]-v1[2], 1];
    // return normal vector
    return cross3(vec1, vec2);
};
