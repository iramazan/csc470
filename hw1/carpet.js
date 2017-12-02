var number_of_iterations = 4; // number of divisions to perform
var gl; // opengl functions
var canvas;
var shader_program;

window.onload = function main()
{
    var vertices = [
        0.33,  0.33,
        0.33, -0.33,
        -0.33, -0.33,
        -0.33,  0.33,
    ];
    var n = 0; // number of iterations currently performed
    gl_init(); // setup
    compile_shaders(); // shader program
    draw(vertices, n); // do the actual work
};

// Initialize opengl
function gl_init()
{
    canvas = document.getElementById("gl_canvas");
    try {
        gl = canvas.getContext('experimental-webgl');
    } catch (e) {
        throw new Error('WebGL could not be found');
    }
    // prepare viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

// compile shaders and create shader program
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

// prepare data and render
function draw(vertices, n)
{
    // prepare data to send to graphics card
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    var frag_in = gl.getAttribLocation(shader_program, "coordinate");
    gl.vertexAttribPointer(frag_in, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(frag_in);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // perform iterations
    n++;
    if (n < number_of_iterations) {
        draw(vertices.map((p) => {return (p / 3) + 0.66}), n); // top right
        draw(vertices.map((p) => {return (p / 3) - 0.66}), n); // bottom left
        draw(vertices.map((p, i) => { // bottom right
            if (i % 2 === 0)
                return -1*((p / 3) - 0.66)
            else
                return (p / 3) - 0.66
        }), n);
        draw(vertices.map((p, i) => { // top left
            if (i % 2 === 0)
                return -1*((p / 3) + 0.66)
            else
                return (p / 3) + 0.66
        }), n);
        draw(vertices.map((p, i) => { // mid right
            if (i % 2 === 0)
                return (p / 3) - 0.66
            else
                return (p / 3)
        }), n);
        draw(vertices.map((p, i) => { // mid left
            if (i % 2 === 0)
                return (p / 3) + 0.66
            else
                return (p / 3)
        }), n);
        draw(vertices.map((p, i) => { // bottom
            if (i % 2 === 1)
                return (p / 3) - 0.66
            else
                return (p / 3)
        }), n);
        draw(vertices.map((p, i) => { // top
            if (i % 2 === 1)
                return (p / 3) + 0.66
            else
                return (p / 3)
        }), n);
    }
}
