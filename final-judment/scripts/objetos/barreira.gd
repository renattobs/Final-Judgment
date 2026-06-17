extends StaticBody2D

@export var tamanho := Vector2(64, 64)

func _ready():
	var shape = RectangleShape2D.new()
	shape.size = tamanho

	$CollisionShape2D.shape = shape
