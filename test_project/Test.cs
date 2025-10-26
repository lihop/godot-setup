using Godot;

public partial class Test : Node
{
	public override void _Ready()
	{
		GD.Print("Test success!");
		GetTree().Quit(0);
	}
}
