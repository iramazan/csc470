var canvas;
var gl;
var shader_program;
var height_map = [];
//var scene_width = 128;
//var scene_height = 128;
var scene_dim = 8;
var vertices = [];
var x_shift = 0;
var y_shift = -1;
var z_shift = -6;
var pitch = -0.3;
var yaw = 0;

// process input keys
document.addEventListener('keydown', function(event) {
    if (event.keyCode == 37) { // left pressed
        var speed = 0.1;
        console.log('Left Arrow Pressed');
        x_shift += speed;
        prep_data();
    }
    else if (event.keyCode == 38) { // up pressed
        var speed = 0.1;
        console.log('Up Arrow Pressed');
        z_shift -= speed;
        prep_data();
    }
    else if (event.keyCode == 39) { // right pressed
        var speed = 0.1;
        console.log('Right Arrow Pressed');
        x_shift -= speed;
        prep_data();
    }
    else if (event.keyCode == 40) { // down pressed
        var speed = 0.1;
        console.log('Down Arrow Pressed');
        z_shift += speed;
        prep_data();
    }
    else if (event.keyCode == 87) { // W pressed
        var speed = 0.01;
        console.log('W pressed');
        pitch -= speed;
        prep_data();
    }
    else if (event.keyCode == 65) { // A pressed
        var speed = 0.01;
        console.log('A pressed');
        yaw += speed;
        prep_data();
    }
    else if (event.keyCode == 83) { // S pressed
        var speed = 0.01;
        console.log('S pressed');
        pitch += speed;
        prep_data();
    }
    else if (event.keyCode == 68) { // D pressed
        var speed = 0.01;
        console.log('D pressed');
        yaw -= speed;
        prep_data();
    }
});

window.onload = function main()
{
    gl_init();
    compile_shaders();
    vert_gen();
    prep_data();
    render();
};

/*
 * Transoform t in interval [a,b] to [c,d]
 * f(t) = c + ((d - c) / (b - a)) * (t - a)
 */
function intv(t, a, b, c, d)
{
    return c + ((d - c) / (b - a)) * (t - a);
}
 
/*
 * Initialize gl context
 */
function gl_init()
{
    canvas = document.getElementById("gl_canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
}

/*
 * Compile Shaders
 */
function compile_shaders()
{
    // vertex shader
    var vert_shader = gl.createShader(gl.VERTEX_SHADER);
    var vert_code = document.getElementById("vertex_shader");
    gl.shaderSource(vert_shader, vert_code.text);
    gl.compileShader(vert_shader);
    if (!gl.getShaderParameter(vert_shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(vert_shader));
    }

    // fragment shader
    var frag_shader = gl.createShader(gl.FRAGMENT_SHADER);
    var frag_code = document.getElementById("fragment_shader");
    gl.shaderSource(frag_shader, frag_code.text);
    gl.compileShader(frag_shader);
    if (!gl.getShaderParameter(frag_shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(frag_shader));
    }

    // create shader program
    shader_program = gl.createProgram();
    gl.attachShader(shader_program, vert_shader);
    gl.attachShader(shader_program, frag_shader);
    gl.linkProgram(shader_program);
    if (!gl.getProgramParameter(shader_program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(shader_program));
    }
    gl.useProgram(shader_program);
}

/*
 * Subdivide plane into n*n subplanes
 */
function subdivide(n)
{
    var D = vertices.pop();
    var C = vertices.pop();
    var B = vertices.pop();
    var A = vertices.pop();
    for (var i = 0; i < n; i++) {
        // left line segment
        var P1 = D.subv(A).multc(i).divc(3).addv(A);
        var P2 = C.subv(B).multc(i).divc(3).addv(B);
        // right line segment
        var Q1 = D.subv(A).multc(i+1).divc(3).addv(A);
        var Q2 = C.subv(B).multc(i+1).divc(3).addv(B);
        // create n subplanes along line segments
        for (var j = 0; j < n; j++) {
            var An = P2.subv(P1).multc(j).divc(3).addv(P1);
            var Bn = P2.subv(P1).multc(j+1).divc(3).addv(P1);
            var Cn = Q2.subv(Q1).multc(j+1).divc(3).addv(Q1);
            var Dn = Q2.subv(Q1).multc(j).divc(3).addv(Q1);
            vertices.push(An);
            vertices.push(Bn);
            vertices.push(Cn);
            vertices.push(Dn);
        }
    }
}

/*
 * Generate a height map
 */
function vert_gen()
{
    // generation loop
    for (var x = 0; x < scene_dim; x++) {
        var column = [];
        for (var y = 0; y < scene_dim; y++) {
            var nx = x / scene_dim - 0.5;
            var ny = y / scene_dim - 0.5;
            var e = 1 * intv(simplex_noise(1 * nx,  1 * ny), -1, 1, 0, 1) +
                0.5 * intv(simplex_noise(2 * nx, 2 * ny), -1, 1, 0, 1) +
                0.25 * intv(simplex_noise(4 * nx, 2 * ny), -1, 1, 0, 1) +
                0.125 * intv(simplex_noise(4 * nx, 4 * ny), -1, 1, 0, 1);
            column.push(Math.pow(e, 1.51));
        }
        column.forEach(e => height_map.push(e));
    }
    // Create vertices from height map
    var sector = [
        new vec4(-3, 0,  3, 1),
        new vec4(-3, 0, -3, 1),
        new vec4( 3, 0, -3, 1),
        new vec4( 3, 0,  3, 1)
    ];
    sector.forEach(e => vertices.push(e));
    subdivide(scene_dim); // subdivide plane
    for (var i = 0; i < vertices.length; i++) {
        vertices[i].y = height_map[i];
    }
}

/*
 * Prepare data for sending to shaders
 */
function prep_data()
{
    // send data to fragment shader
    var viewt = shift(x_shift, y_shift, z_shift);
    var viewt_location = gl.getUniformLocation(shader_program, "viewt");
    gl.uniformMatrix4fv(viewt_location, false, new Float32Array(viewt));
    var viewrx = rotate_X(pitch);
    var viewrx_location = gl.getUniformLocation(shader_program, "viewrx");
    gl.uniformMatrix4fv(viewrx_location, false, new Float32Array(viewrx));
    var viewry = rotate_Y(yaw);
    var viewry_location = gl.getUniformLocation(shader_program, "viewry");
    gl.uniformMatrix4fv(viewry_location, false, new Float32Array(viewry));
    var proj = persp(90, canvas.width/canvas.height, 1, 1000);
    var proj_location = gl.getUniformLocation(shader_program, "projection");
    gl.uniformMatrix4fv(proj_location, false, new Float32Array(proj));
}

/*
 * Render the scene
 */
function render()
{
    var prev = 0;
    var rloop = function(current) {
        current *= 0.001;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // buffer vertices
        var verts = [];
        vertices.forEach(e => verts = verts.concat(e.as_array()));
        var vert_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
        var vert_coord = gl.getAttribLocation(shader_program, "coordinate");
        gl.vertexAttribPointer(vert_coord, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vert_coord);
        // rotate around plane
        var delta = current - prev;
        var rot_anim = rotate_Y(delta);
        var rot_model_location = gl.getUniformLocation(shader_program, "rot_model");
        gl.uniformMatrix4fv(rot_model_location, false, new Float32Array(rot_anim));
        // draw
        gl.drawArrays(gl.TRIANGLE_FAN, 0, verts.length/4);
        prev = current;
        window.requestAnimFrame(render, canvas);
    };
    window.requestAnimationFrame(rloop);
}
