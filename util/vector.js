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
    // create normal vector
    var cross_vec = [
        vec1[1]*vec2[2]-vec1[2]*vec2[1],
        vec1[2]*vec2[0]-vec1[0]*vec2[2],
        vec1[0]*vec2[1]-vec1[1]*vec2[0],
        1
    ];
    return cross_vec;
};
